export const PAGE_SIZE = 40;

export const paginate = <T,>(items: T[], page: number, pageSize: number = PAGE_SIZE): T[] => items.slice((page - 1) * pageSize, page * pageSize);

export const pageCount = (itemCount: number, pageSize: number = PAGE_SIZE): number => Math.max(1, Math.ceil(itemCount / pageSize));
