import { create } from 'zustand';
import { AppState, Report, Category, SearchFilters, SearchHistory, SavedSearch, SortOptions } from '@/types';
import { reportsApi, categoriesApi } from '@/lib/api-client';
