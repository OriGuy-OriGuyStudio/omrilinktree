"use client";

import { LinktreeData } from "./linktree-editor";
import * as LucideIcons from "lucide-react";

interface LivePreviewProps {
  data: LinktreeData;
}

export default function LivePreview({ data }: LivePreviewProps) {
  // Dynamic background style
  const getBackgroundStyle = () => {
    switch (data.bg_type) {
      case "solid":
        return { backgroundColor: data.bg_value || "#0a0a0a" };
      case "image":
        return {
          backgroundImage: `url(${data.bg_value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };
      case "gradient":
        return { background: data.bg_value };
      default:
        return {}; // fallback
    }
  };

  return (
    <div className="w-[340px] h-[700px] rounded-[3rem] border-[8px] border-neutral-900 bg-black overflow-hidden relative shadow-2xl shrink-0 ring-1 ring-white/10">
      {/* Phone Notch */}
      <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
        <div className="w-32 h-6 bg-neutral-900 rounded-b-3xl"></div>
      </div>

      {/* Preview Content */}
      <div
        className={`w-full h-full overflow-y-auto no-scrollbar pb-12 pt-14 px-6 flex flex-col items-center`}
        style={getBackgroundStyle()}
      >
        {/* Profile Section */}
        <div
          className="flex flex-col items-center text-center mt-6 z-10 w-full mb-8 drop-shadow-md"
          style={{ color: data.text_color || "#ffffff" }}
        >
          {data.logo_url !== "hidden" && (
            <div
              className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-white/20 shadow-xl bg-neutral-800 flex items-center justify-center shrink-0 transition-transform duration-200"
              style={{
                transform: `translateY(${data.logo_y_offset || 0}px)`,
              }}
            >
              {data.logo_url ? (
                <img
                  src={data.logo_url}
                  alt={data.business_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl font-bold">
                  {data.business_name ? data.business_name.charAt(0) : ""}
                </div>
              )}
            </div>
          )}
          <div
            className="transition-transform duration-200"
            style={{
              transform: `translateY(${data.header_y_offset || 0}px)`,
            }}
          >
            <h2 className="text-xl font-bold tracking-tight">
              {data.business_name || "שם העסק"}
            </h2>
            {data.description && (
              <p className="text-sm mt-2 opacity-90 max-w-[250px] leading-relaxed">
                {data.description}
              </p>
            )}
          </div>
        </div>

        <div
          className="w-full flex-1 flex flex-col transition-transform duration-200"
          style={{
            transform: `translateY(${data.links_y_offset || 0}px)`,
          }}
        >
          <div className="w-full space-y-4 z-10">
            {data.links.map((link) => {
              const getIcon = (name: string) => {
                if (!name) return LucideIcons.Link;
                let pascalName = name;
                if (name.includes("-")) {
                  pascalName = name
                    .split("-")
                    .map(
                      (w) =>
                        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
                    )
                    .join("");
                } else {
                  pascalName = name.charAt(0).toUpperCase() + name.slice(1);
                }
                // @ts-ignore
                return LucideIcons[pascalName] || LucideIcons.Link;
              };
              const Icon = getIcon(link.icon);

              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-center w-full p-4 backdrop-blur-md border border-white/10 transition-all cursor-pointer overflow-hidden shadow-lg hover:shadow-white/5 hover:-translate-y-0.5"
                  style={{
                    background: link.bg_color || "rgba(255,255,255,0.1)",
                    color: link.text_color || "#ffffff",
                    borderRadius: data.border_radius || "12px",
                  }}
                >
                  <div className="absolute right-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-center px-8 truncate w-full">
                    {link.title || "כותרת קישור"}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-center pb-4 z-10">
            <a
              href="https://insights.origuystudio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-full text-xs font-medium tracking-wide transition-all hover:bg-black/40 flex items-center gap-2 origin-center"
              style={{ color: data.text_color || "#ffffff" }}
            >
              <span>עוצב ופותח על ידי סטודיו אורי גיא</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
