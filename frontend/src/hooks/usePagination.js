import { useState, useEffect, useMemo } from 'react';

export const usePagination = (items, itemsPerPage = 102, options = {}) => {
  const { page: controlledPage, onPageChange } = options;
  const isControlled =
    typeof controlledPage === 'number' && typeof onPageChange === 'function';
  const [uncontrolledPage, setUncontrolledPage] = useState(1);
  const page = isControlled ? controlledPage : uncontrolledPage;

  const setPage = (nextPage) => {
    if (isControlled) onPageChange(nextPage);
    else setUncontrolledPage(nextPage);
  };

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  useEffect(() => {
    if (!isControlled) setUncontrolledPage(1);
  }, [items.length, itemsPerPage, isControlled]);

  useEffect(() => {
    if (page <= totalPages) return;
    if (isControlled) onPageChange(totalPages);
    else setUncontrolledPage(totalPages);
  }, [page, totalPages, isControlled, onPageChange]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, page, itemsPerPage]);

  const range = useMemo(() => {
    if (!items.length) return { start: 0, end: 0 };
    const start = (page - 1) * itemsPerPage + 1;
    const end = Math.min(page * itemsPerPage, items.length);
    return { start, end };
  }, [items.length, page, itemsPerPage]);

  const goToPage = (nextPage) => {
    if (nextPage >= 1 && nextPage <= totalPages) {
      setPage(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (page <= 3) {
      for (let i = 2; i <= 5; i++) pages.push(i);
      pages.push('...', totalPages);
    } else if (page >= totalPages - 2) {
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push('...', page - 1, page, page + 1, '...', totalPages);
    }

    return pages;
  }, [page, totalPages]);

  return {
    page,
    totalPages,
    paginatedItems,
    range,
    goToPage,
    pageNumbers,
  };
};
