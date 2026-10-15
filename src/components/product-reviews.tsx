"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { getCustomerToken } from "@/lib/account";
import { endpoint, jsonHeaders, requestJson, responseMessage } from "@/lib/account-api";

interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string;
  author: string;
  verified_purchase: boolean;
  created_at: string;
}

interface ReviewsPayload {
  data: Review[];
  meta: { current_page: number; last_page: number };
  summary: { average: number | null; count: number; breakdown: Record<string, number> };
  viewer: {
    signed_in: boolean;
    can_review: boolean;
    review: { rating: number; title: string | null; body: string; status: "pending" | "approved" | "rejected" } | null;
  };
}

const STATUS_TEXT = {
  pending: "Your review is waiting for approval. It will appear here once our team has checked it.",
  approved: "Your review is published. Thank you!",
  rejected: "Your review was not published. You can edit it and send it again.",
};

function Stars({ value, label }: { value: number; label?: string }) {
  return (
    <span className="reviewStarsRow" aria-label={label ?? `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i key={star} className={value >= star ? "ri-star-fill" : value >= star - 0.5 ? "ri-star-half-line" : "ri-star-line"} aria-hidden="true" />
      ))}
    </span>
  );
}

/** Approved reviews of a product, and the review form for customers whose order was delivered. */
export function ProductReviews({ productId, slug }: { productId: number; slug: string }) {
  const [payload, setPayload] = useState<ReviewsPayload | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async (page = 1) => {
    const url = endpoint(`/products/${encodeURIComponent(slug)}/reviews?page=${page}`);
    if (!url) return;
    const token = getCustomerToken();
    const { response, payload: data } = await requestJson<ReviewsPayload>(url, { headers: jsonHeaders(token || undefined) });
    if (!response.ok) throw new Error(responseMessage(response, data));
    setPayload(data);
    setReviews((current) => (page === 1 ? data.data : [...current, ...data.data]));
  }, [slug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Reviews could not be loaded."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function loadMore() {
    if (!payload) return;
    setLoadingMore(true);
    try {
      await load(payload.meta.current_page + 1);
    } catch {
      // Keep what is on screen; the button stays for another try.
    } finally {
      setLoadingMore(false);
    }
  }

  function openForm() {
    const own = payload?.viewer.review;
    setRating(own?.rating ?? 0);
    setMessage("");
    setFormOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating < 1) return setMessage("Please choose a star rating.");
    const url = endpoint("/account/reviews");
    const token = getCustomerToken();
    if (!url || !token) return;
    const form = new FormData(event.currentTarget);

    setSaving(true);
    setMessage("");
    try {
      const { response, payload: data } = await requestJson<{ message?: string }>(url, {
        method: "POST",
        headers: jsonHeaders(token),
        body: JSON.stringify({ product_id: productId, rating, title: form.get("title"), body: form.get("body") }),
      });
      if (!response.ok) throw new Error(responseMessage(response, data));
      setFormOpen(false);
      await load();
      setMessage(data.message || STATUS_TEXT.pending);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your review could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const summary = payload?.summary;
  const viewer = payload?.viewer;

  return (
    <section className="productReviews" id="reviews" aria-labelledby="reviews-title">
      <div className="productReviewsHead">
        <div>
          <h2 id="reviews-title">Customer reviews</h2>
          {summary && summary.count > 0 && summary.average !== null ? (
            <p className="reviewAverage">
              <Stars value={summary.average} label={`Rated ${summary.average} out of 5`} />
              <b>{summary.average}</b> out of 5 · {summary.count} review{summary.count === 1 ? "" : "s"}
            </p>
          ) : (
            !loadError && payload && <p className="muted">No reviews yet.</p>
          )}
        </div>
        {viewer && !formOpen && (
          viewer.can_review ? (
            <button type="button" className="button buttonDark" onClick={openForm}>
              {viewer.review ? "Edit your review" : "Write a review"}
            </button>
          ) : !viewer.signed_in ? (
            <Link className="button buttonOutline" href={`/account?next=${encodeURIComponent(`/products/${slug}#reviews`)}`}>Sign in to review</Link>
          ) : null
        )}
      </div>

      {summary && summary.count > 0 && (
        <div className="reviewBreakdown">
          {[5, 4, 3, 2, 1].map((stars) => {
            const total = summary.breakdown[String(stars)] ?? 0;
            return (
              <div key={stars}>
                <span>{stars} <i className="ri-star-fill" aria-hidden="true" /></span>
                <span className="reviewBar"><span style={{ width: `${(total / summary.count) * 100}%` }} /></span>
                <span>{total}</span>
              </div>
            );
          })}
        </div>
      )}

      {viewer?.signed_in && !viewer.can_review && (
        <p className="muted">Only customers whose order has been delivered can review this piece.</p>
      )}
      {viewer?.review && !formOpen && <p className="integrationNotice" role="status">{STATUS_TEXT[viewer.review.status]}</p>}
      {message && <p className="integrationNotice" role="status">{message}</p>}
      {loadError && <p className="integrationNotice" role="alert">{loadError}</p>}

      {formOpen && (
        <form className="reviewForm" onSubmit={submit}>
          <fieldset>
            <legend>Your rating *</legend>
            <div className="reviewStarPicker">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} aria-pressed={rating >= star} aria-label={`${star} star${star === 1 ? "" : "s"}`}>
                  <i className={rating >= star ? "ri-star-fill" : "ri-star-line"} aria-hidden="true" />
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            Title
            <input name="title" maxLength={120} defaultValue={viewer?.review?.title ?? ""} placeholder="Sum it up in a few words" />
          </label>
          <label>
            Your review *
            <textarea name="body" required minLength={10} maxLength={2000} rows={5} defaultValue={viewer?.review?.body ?? ""} placeholder="How does it look and feel? How was the finish?" />
          </label>
          <p className="muted">Reviews are checked by our team before they appear. Your first name and last initial are shown.</p>
          <div className="reviewFormActions">
            <button className="button buttonDark" type="submit" disabled={saving}>{saving ? "Sending…" : "Submit review"}</button>
            <button className="button buttonOutline" type="button" onClick={() => setFormOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      {reviews.length > 0 && (
        <ol className="reviewList">
          {reviews.map((review) => (
            <li key={review.id}>
              <Stars value={review.rating} />
              {review.title && <h3>{review.title}</h3>}
              <p>{review.body}</p>
              <small>
                {review.author}
                {review.verified_purchase && <> · <i className="ri-shield-check-line" aria-hidden="true" /> Verified purchase</>}
                {" · "}{new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </small>
            </li>
          ))}
        </ol>
      )}
      {payload && payload.meta.current_page < payload.meta.last_page && (
        <button type="button" className="button buttonOutline" onClick={() => void loadMore()} disabled={loadingMore}>
          {loadingMore ? "Loading…" : "Show more reviews"}
        </button>
      )}
    </section>
  );
}
