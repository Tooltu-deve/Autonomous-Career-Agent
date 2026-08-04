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

interface Props {
  data: ProfileData;
  setData: Dispatch<SetStateAction<ProfileData>>;
  initials: string;
  onSkip: () => void;
  onNext: () => void;
  onShowToast: (msg: string) => void;
}

export function StepBasicInfo({
  data,
  setData,
  initials,
  onSkip,
  onNext,
  onShowToast,
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
              placeholder="Nguyễn Văn A"
              onChange={(e) =>
                setData((d) => ({ ...d, name: e.target.value }))
              }
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

        <div className="ps-form-group">
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
        </div>

        <div className="ps-form-group">
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

        <div className="ps-form-group">
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
          Tiếp: Education →
        </button>
      </div>
    </div>
  );
}
