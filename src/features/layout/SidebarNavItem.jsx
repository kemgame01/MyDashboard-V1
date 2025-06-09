import React from "react";
import { ExternalLink } from "lucide-react";

export default function SidebarNavItem({
  item,
  isActive,
  isExpanded,
  onExpand,
  expandedIdx,
  idx,
  setMobileOpen,
  onClick,
}) {
  // Check if item is an external link
  const isExternal = !!item.url;

  // Choose between <button> and <a>
  const NavButton = isExternal ? "a" : "button";
  const navProps = isExternal
    ? { href: item.url, target: "_blank", rel: "noopener noreferrer" }
    : {
        onClick: () => {
          if (item.children) {
            onExpand(expandedIdx === idx ? null : idx);
          } else {
            setMobileOpen?.(false);
            item.onClick?.();
            onExpand(null);
            onClick?.(item.activeKey || item.label); // set active
          }
        },
      };

  return (
    <li>
      <div className="flex flex-col">
        <NavButton
          {...navProps}
          className={`flex items-center gap-3 w-full text-left p-2 rounded transition font-medium
            hover:bg-gray-700
            ${isActive ? "bg-[#223163] text-white" : ""}
            ${isExternal ? "pr-3" : ""}
          `}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
          {item.badge !== undefined && (
            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {item.badge}
            </span>
          )}
          {item.external && (
            <span className="ml-2">
              <ExternalLink size={15} />
            </span>
          )}
          {item.children && (
            <span className="ml-auto">{isExpanded ? "▾" : "▸"}</span>
          )}
        </NavButton>
        {/* Subnav */}
        {item.children && isExpanded && (
          <ul className="ml-7 mt-1 space-y-1">
            {item.children.map((sub, subIdx) => (
              <li key={subIdx}>
                <button
                  onClick={() => {
                    setMobileOpen?.(false);
                    sub.onClick();
                    onClick?.(sub.activeKey || sub.label);
                  }}
                  className={`flex items-center gap-2 w-full text-left text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded transition
                    ${isActive === (sub.activeKey || sub.label) ? "bg-[#223163] text-white" : ""}
                  `}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.label}</span>
                  {sub.badge !== undefined && (
                    <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                      {sub.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
