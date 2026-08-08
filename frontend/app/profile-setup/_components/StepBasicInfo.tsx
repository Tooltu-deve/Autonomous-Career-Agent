"use client";

/**
 * StepBasicInfo — Step 1: Personal Info form.
 */
import type { Dispatch, SetStateAction } from "react";
import {
  EmailIcon,
  FileIcon,
  LinkIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "./Icons";
import type { ProfileData } from "../_types/types";
import type { FormErrors } from "../_hooks/useProfileSetup";

interface Props {
  data: ProfileData;
  setData: Dispatch<SetStateAction<ProfileData>>;
  initials: string;
  onSkip: () => void;
  onNext: () => void;
  onShowToast: (msg: string) => void;
  errors?: FormErrors;
}

export function StepBasicInfo({
  data,
  setData,
  initials,
  onSkip,
  onNext,
  onShowToast,
  errors = {},
}: Props) {
  return (
    <div className="ps-card ps-animate-in">
      <div className="ps-card-header">
        <div className="ps-card-title">
          <UserIcon />
          Personal Info
        </div>
        <span className="ps-step-tag">STEP 1/4</span>
      </div>

      {/* Avatar row */}
      <div className="ps-avatar-row">
        <div className="ps-avatar-lg">{initials}</div>
        <div>
          <button
            className="ps-btn-upload"
            type="button"
            onClick={() => onShowToast("Avatar upload feature coming soon!")}
          >
            Upload avatar
          </button>
          <div className="ps-upload-hint">JPG or PNG format, max 5MB</div>
        </div>
      </div>

      <div className="ps-grid2">
        <div className="ps-form-group ps-span-full">
          <label htmlFor="ps-name">Full Name</label>
          <div className="ps-input-wrap">
            <input
              id="ps-name"
              type="text"
              value={data.name}
              placeholder="Nguyen Van A"
              onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
            />
            <UserIcon />
          </div>
        </div>

        <div className="ps-form-group ps-span-full">
          <label htmlFor="ps-headline">Professional Headline</label>
          <div className="ps-input-wrap">
            <input
              id="ps-headline"
              type="text"
              value={data.headline}
              placeholder="Computer Science Student · MIT"
              onChange={(e) =>
                setData((d) => ({ ...d, headline: e.target.value }))
              }
            />
            <FileIcon />
          </div>
        </div>

        <div className="ps-form-group">
          <label htmlFor="ps-email">Email</label>
          <div className="ps-input-wrap">
            <input
              id="ps-email"
              type="email"
              value={data.email}
              placeholder="you@email.com"
              onChange={(e) =>
                setData((d) => ({ ...d, email: e.target.value }))
              }
            />
            <EmailIcon />
          </div>
        </div>

        <div
          className={`ps-form-group${errors.phone ? " ps-field-error-state" : ""}`}
        >
          <label htmlFor="ps-phone">Phone Number</label>
          <div className="ps-input-wrap">
            <input
              id="ps-phone"
              type="tel"
              value={data.phone}
              placeholder="+84 901 234 567"
              onChange={(e) =>
                setData((d) => ({ ...d, phone: e.target.value }))
              }
            />
            <PhoneIcon />
          </div>
          {errors.phone && <p className="ps-field-error">{errors.phone}</p>}
        </div>

        <div className="ps-form-group ps-span-full">
          <label htmlFor="ps-location">Location</label>
          <div className="ps-input-wrap">
            <input
              id="ps-location"
              type="text"
              value={data.location}
              placeholder="Ho Chi Minh City, Vietnam"
              onChange={(e) =>
                setData((d) => ({ ...d, location: e.target.value }))
              }
            />
            <MapPinIcon />
          </div>
        </div>

        <div
          className={`ps-form-group${errors.github ? " ps-field-error-state" : ""}`}
        >
          <label htmlFor="ps-github">GitHub / Portfolio</label>
          <div className="ps-input-wrap">
            <input
              id="ps-github"
              type="text"
              value={data.github}
              placeholder="github.com/username"
              onChange={(e) =>
                setData((d) => ({ ...d, github: e.target.value }))
              }
            />
            <LinkIcon />
          </div>
          {errors.github && <p className="ps-field-error">{errors.github}</p>}
        </div>

        <div
          className={`ps-form-group${errors.linkedin ? " ps-field-error-state" : ""}`}
        >
          <label htmlFor="ps-linkedin">LinkedIn</label>
          <div className="ps-input-wrap">
            <input
              id="ps-linkedin"
              type="text"
              value={data.linkedin}
              placeholder="linkedin.com/in/username"
              onChange={(e) =>
                setData((d) => ({ ...d, linkedin: e.target.value }))
              }
            />
            <LinkIcon />
          </div>
          {errors.linkedin && (
            <p className="ps-field-error">{errors.linkedin}</p>
          )}
        </div>

        <div className="ps-form-group ps-span-full">
          <label htmlFor="ps-summary">Professional Summary</label>
          <textarea
            id="ps-summary"
            value={data.summary}
            placeholder="A short 2-3 sentence introduction that AI will use in every auto-generated CV..."
            onChange={(e) =>
              setData((d) => ({ ...d, summary: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="ps-footer-actions">
        <span className="ps-skip-link" onClick={onSkip}>
          Skip all
        </span>
        <button className="ps-btn-next" onClick={onNext}>
          Next: Education →
        </button>
      </div>
    </div>
  );
}
