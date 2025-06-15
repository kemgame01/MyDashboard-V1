import React from "react";
import { ExternalLink } from "lucide-react";
import '../../styles/sidebar-profile-enhancement.css';

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
    <li className="sidebar-nav-item">
      <div className="flex flex-col">
        <NavButton
          {...navProps}
          className={`sidebar-nav-button ${isActive ? 'active' : ''} ${isExternal ? 'external' : ''}`}
        >
          <div className="sidebar-nav-content">
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
            {item.badge !== undefined && (
              <span className="sidebar-nav-badge">
                {item.badge}
              </span>
            )}
            {item.external && (
              <span className="sidebar-nav-external">
                <ExternalLink size={15} />
              </span>
            )}
            {item.children && (
              <span className={`sidebar-nav-chevron ${isExpanded ? 'expanded' : ''}`}>
                {isExpanded ? "▾" : "▸"}
              </span>
            )}
          </div>
        </NavButton>
        
        {/* Subnav */}
        {item.children && (
          <ul className={`sidebar-subnav ${isExpanded ? 'expanded' : ''}`}>
            {item.children.map((sub, subIdx) => (
              <li key={subIdx}>
                <button
                  onClick={() => {
                    setMobileOpen?.(false);
                    sub.onClick();
                    onClick?.(sub.activeKey || sub.label);
                  }}
                  className={`sidebar-subnav-button ${isActive === (sub.activeKey || sub.label) ? 'active' : ''}`}
                >
                  <span className="sidebar-subnav-icon">{sub.icon}</span>
                  <span className="sidebar-subnav-label">{sub.label}</span>
                  {sub.badge !== undefined && (
                    <span className="sidebar-subnav-badge">
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