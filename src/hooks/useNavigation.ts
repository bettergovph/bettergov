/**
 * Hook for loading navigation data with service categories
 */

import { useState, useEffect } from 'react';
import { fetchServiceCategories } from '../lib/cms-data';
import { buildMainNavigation } from '../data/navigation';
import { NavigationItem } from '../types';

export function useNavigation() {
  const [navigation, setNavigation] = useState<NavigationItem[]>(() =>
    buildMainNavigation()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceCategories()
      .then(data => {
        const nav = buildMainNavigation(
          data as {
            categories: {
              category: string;
              slug: string;
              subcategories: unknown[];
            }[];
          }
        );
        setNavigation(nav);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load service categories for navigation:', err);
        // Use default navigation without service categories
        setNavigation(buildMainNavigation());
        setLoading(false);
      });
  }, []);

  return { navigation, loading };
}
