// src/features/customers/Pagination.jsx
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import '../../styles/CustomerSection.css';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2; // Pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];
    let l;

    // Always show first page
    range.push(1);

    // Calculate range around current page
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i);
      }
    }

    // Always show last page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Remove duplicates and sort
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b);

    // Add dots where there are gaps
    uniqueRange.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  return (
    <div className="customer-pagination" data-page-info={`Page ${currentPage} of ${totalPages}`}>
      {/* First Page Button - only show if not on page 1 or 2 */}
      {currentPage > 2 && (
        <button
          className="customer-pagination-btn"
          onClick={() => onPageChange(1)}
          aria-label="Go to first page"
          title="First page"
        >
          <ChevronsLeft size={16} />
        </button>
      )}

      {/* Previous Button */}
      <button
        className="customer-pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} className="icon" />
        <span>Previous</span>
      </button>

      {/* Page Numbers */}
      {getPageNumbers().map((number, index) => (
        number === '...' ? (
          <span key={`dots-${index}`} className="customer-pagination-dots">•••</span>
        ) : (
          <button
            key={number}
            className={`customer-pagination-btn ${currentPage === number ? 'active' : ''}`}
            onClick={() => onPageChange(number)}
            aria-label={`Go to page ${number}`}
          >
            {number}
          </button>
        )
      ))}

      {/* Next Button */}
      <button
        className="customer-pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight size={16} className="icon" />
      </button>

      {/* Last Page Button - only show if not on last page or second to last */}
      {currentPage < totalPages - 1 && (
        <button
          className="customer-pagination-btn"
          onClick={() => onPageChange(totalPages)}
          aria-label="Go to last page"
          title="Last page"
        >
          <ChevronsRight size={16} />
        </button>
      )}
    </div>
  );
}