"use client";

/**
 * TemplatePicker — Grid 3 thẻ CV template với crossfade hover preview.
 * Front face hiển thị tên/mô tả; hover → Back face hiện mini CV preview.
 */
import type { TemplateName } from "@/types/api";
import { CheckIcon } from "./Icons";

interface Props {
  selectedTemplate: TemplateName;
  onSelect: (id: TemplateName) => void;
}

const TEMPLATES: {
  id: TemplateName;
  name: string;
  badge: string;
  desc: string;
  preview: React.ReactNode;
}[] = [
  {
    id: "classic",
    name: "Classic",
    badge: "ATS Standard",
    desc: "Cổ điển, tối giản, chuẩn ATS tối đa.",
    preview: (
      <div className="ps-tpl-preview ps-tpl-classic">
        <div className="ps-tpl-header-classic">
          <div className="ps-tpl-name">NGUYỄN VĂN A</div>
          <div className="ps-tpl-sub">Software Engineer &bull; Ho Chi Minh City</div>
          <div className="ps-tpl-sub">nguyenvana@email.com &bull; +84 901 234 567</div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-classic">EXPERIENCE</div>
          <div className="ps-tpl-entry">
            <strong>Senior Developer</strong> &bull; Company A &nbsp;|&nbsp; 2022–Now
          </div>
          <div className="ps-tpl-bullet">&bull; Led team of 5 engineers on microservices platform</div>
          <div className="ps-tpl-bullet">&bull; Improved system performance by 40%</div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-classic">EDUCATION</div>
          <div className="ps-tpl-entry">
            <strong>B.S. Computer Science</strong> &bull; University of Science
          </div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-classic">SKILLS</div>
          <div className="ps-tpl-entry">
            Python &bull; React &bull; Docker &bull; PostgreSQL &bull; TypeScript
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "modern",
    name: "Modern",
    badge: "Recommended",
    desc: "Hiện đại, thanh lịch, có màu sắc điểm nhấn.",
    preview: (
      <div className="ps-tpl-preview ps-tpl-modern">
        <div className="ps-tpl-header-modern">
          <div className="ps-tpl-name-modern">Nguyễn Văn A</div>
          <div className="ps-tpl-sub-modern">Software Engineer</div>
          <div className="ps-tpl-meta-modern">
            nguyenvana@email.com &nbsp;&bull;&nbsp; +84 901 234 567
          </div>
        </div>
        <div className="ps-tpl-modern-body">
          <div className="ps-tpl-section">
            <div className="ps-tpl-stitle-modern">EXPERIENCE</div>
            <div className="ps-tpl-entry-modern">
              <strong>Senior Developer</strong> &bull; Company A &bull; 2022–Now
            </div>
            <div className="ps-tpl-bullet-modern">&bull; Led team of 5 engineers on microservices</div>
            <div className="ps-tpl-bullet-modern">&bull; Improved performance by 40%</div>
          </div>
          <div className="ps-tpl-section">
            <div className="ps-tpl-stitle-modern">SKILLS</div>
            <div className="ps-tpl-tags-modern">
              <span>Python</span>
              <span>React</span>
              <span>Docker</span>
              <span>TypeScript</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "academic",
    name: "Academic",
    badge: "Detailed",
    desc: "Học thuật, chi tiết. Thích hợp nghiên cứu & giảng dạy.",
    preview: (
      <div className="ps-tpl-preview ps-tpl-academic">
        <div className="ps-tpl-header-academic">
          <div className="ps-tpl-name-academic">NGUYỄN VĂN A</div>
          <div className="ps-tpl-sub-academic">PhD Candidate, Computer Science</div>
          <div className="ps-tpl-sub-academic">University of Science &bull; Ho Chi Minh City</div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-academic">EDUCATION</div>
          <div className="ps-tpl-entry-academic">
            <strong>M.S. Computer Science</strong> &bull; GPA 3.9/4.0
          </div>
          <div className="ps-tpl-entry-academic">University of Science, 2020–2022</div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-academic">PUBLICATIONS</div>
          <div className="ps-tpl-italic">&bull; &ldquo;Deep Learning in NLP&rdquo; &mdash; ICML 2024</div>
          <div className="ps-tpl-italic">&bull; &ldquo;Efficient Transformers&rdquo; &mdash; NeurIPS 2023</div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-academic">SKILLS</div>
          <div className="ps-tpl-entry-academic">
            Python &bull; LaTeX &bull; MATLAB &bull; TensorFlow &bull; R
          </div>
        </div>
      </div>
    ),
  },
];

export function TemplatePicker({ selectedTemplate, onSelect }: Props) {
  return (
    <div className="ps-template-section">
      <div className="ps-template-title">
        Select Preferred CV Template
      </div>
      <div className="ps-template-sub">
        Di chuột vào thẻ để xem trước mẫu CV &bull; Click để chọn
      </div>

      <div className="ps-template-picker">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className={`ps-template-card ${selectedTemplate === tpl.id ? "active" : ""}`}
            onClick={() => onSelect(tpl.id)}
          >
            {/* Front face: info text (visible by default, fades out on hover) */}
            <div className="ps-template-front">
              {selectedTemplate === tpl.id && (
                <div className="ps-template-check">
                  <CheckIcon />
                </div>
              )}
              <span className="ps-template-badge">{tpl.badge}</span>
              <span className="ps-template-name">{tpl.name}</span>
              <span className="ps-template-desc">{tpl.desc}</span>
              <div className="ps-template-hint">Hover to preview →</div>
            </div>

            {/* Back face: CV preview (invisible by default, fades in on hover) */}
            <div className="ps-template-back">
              {selectedTemplate === tpl.id && (
                <div className="ps-template-check">
                  <CheckIcon />
                </div>
              )}
              {tpl.preview}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
