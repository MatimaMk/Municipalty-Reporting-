// utils/smartSearch.ts
import { Issue } from "./localStorage";

export interface SearchFilters {
  query?: string;
  category?: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  minConfidence?: number;
  hasPhoto?: boolean;
  assignedTo?: string;
}

export interface SortOptions {
  field: "createdAt" | "updatedAt" | "priority" | "aiConfidence";
  direction: "asc" | "desc";
}

export const smartSearchUtils = {
  // Fuzzy search in text (case-insensitive)
  fuzzyMatch(text: string, query: string): boolean {
    const cleanText = text.toLowerCase();
    const cleanQuery = query.toLowerCase();

    // Exact match
    if (cleanText.includes(cleanQuery)) return true;

    // Split query into words and check if all words are present
    const words = cleanQuery.split(/\s+/);
    return words.every((word) => cleanText.includes(word));
  },

  // Search issues with query
  searchIssues(issues: Issue[], query: string): Issue[] {
    if (!query || query.trim() === "") return issues;

    const cleanQuery = query.trim();

    return issues.filter((issue) => {
      // Search in title
      if (this.fuzzyMatch(issue.title, cleanQuery)) return true;

      // Search in description
      if (this.fuzzyMatch(issue.description, cleanQuery)) return true;

      // Search in location
      if (issue.location && this.fuzzyMatch(issue.location, cleanQuery)) return true;

      // Search in keywords
      if (
        issue.aiAnalysis?.keywords?.some((keyword) =>
          this.fuzzyMatch(keyword, cleanQuery)
        )
      ) {
        return true;
      }

      // Search in issue type
      if (
        issue.aiAnalysis?.issueType &&
        this.fuzzyMatch(issue.aiAnalysis.issueType, cleanQuery)
      ) {
        return true;
      }

      // Search in user name
      if (issue.userName && this.fuzzyMatch(issue.userName, cleanQuery)) return true;

      return false;
    });
  },

  // Apply filters to issues
  filterIssues(issues: Issue[], filters: SearchFilters): Issue[] {
    let filtered = [...issues];

    // Text search
    if (filters.query) {
      filtered = this.searchIssues(filtered, filters.query);
    }

    // Category filter
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter((issue) => issue.category === filters.category);
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((issue) => issue.status === filters.status);
    }

    // Priority filter
    if (filters.priority && filters.priority !== "all") {
      filtered = filtered.filter((issue) => issue.priority === filters.priority);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(
        (issue) => new Date(issue.createdAt) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter((issue) => new Date(issue.createdAt) <= toDate);
    }

    // AI confidence filter
    if (filters.minConfidence !== undefined) {
      filtered = filtered.filter(
        (issue) =>
          issue.aiConfidence && issue.aiConfidence >= filters.minConfidence!
      );
    }

    // Photo filter
    if (filters.hasPhoto !== undefined) {
      filtered = filtered.filter((issue) =>
        filters.hasPhoto ? !!issue.photoData : !issue.photoData
      );
    }

    // Assigned to filter
    if (filters.assignedTo && filters.assignedTo !== "all") {
      filtered = filtered.filter(
        (issue) => issue.assignedTo === filters.assignedTo
      );
    }

    return filtered;
  },

  // Sort issues
  sortIssues(issues: Issue[], sort: SortOptions): Issue[] {
    const sorted = [...issues];

    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sort.field) {
        case "createdAt":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
        case "priority":
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder];
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case "aiConfidence":
          aVal = a.aiConfidence || 0;
          bVal = b.aiConfidence || 0;
          break;
        default:
          return 0;
      }

      if (sort.direction === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return sorted;
  },

  // Smart filter suggestions based on current data
  getFilterSuggestions(issues: Issue[]): {
    categories: string[];
    priorities: string[];
    statuses: string[];
    assignedUsers: string[];
  } {
    const categories = new Set<string>();
    const priorities = new Set<string>();
    const statuses = new Set<string>();
    const assignedUsers = new Set<string>();

    issues.forEach((issue) => {
      categories.add(issue.category);
      priorities.add(issue.priority);
      statuses.add(issue.status);
      if (issue.assignedTo) {
        assignedUsers.add(issue.assignedTo);
      }
    });

    return {
      categories: Array.from(categories).sort(),
      priorities: ["urgent", "high", "medium", "low"].filter((p) =>
        priorities.has(p)
      ),
      statuses: Array.from(statuses).sort(),
      assignedUsers: Array.from(assignedUsers).sort(),
    };
  },

  // Get duplicate/similar reports using AI analysis
  findSimilarReports(issue: Issue, allIssues: Issue[], threshold: number = 0.7): Issue[] {
    if (!issue.aiAnalysis?.keywords || issue.aiAnalysis.keywords.length === 0) {
      return [];
    }

    const similar: Array<{ issue: Issue; score: number }> = [];

    allIssues.forEach((otherIssue) => {
      if (otherIssue.id === issue.id) return;
      if (!otherIssue.aiAnalysis?.keywords) return;

      // Calculate similarity based on keywords overlap
      const keywords1 = new Set(
        issue.aiAnalysis!.keywords.map((k) => k.toLowerCase())
      );
      const keywords2 = new Set(
        otherIssue.aiAnalysis!.keywords.map((k) => k.toLowerCase())
      );

      const intersection = new Set(
        [...keywords1].filter((k) => keywords2.has(k))
      );
      const union = new Set([...keywords1, ...keywords2]);

      const keywordSimilarity = intersection.size / union.size;

      // Check category match (boost score)
      const categoryMatch = issue.category === otherIssue.category ? 0.2 : 0;

      // Check issue type match (boost score)
      const issueTypeMatch =
        issue.aiAnalysis?.issueType === otherIssue.aiAnalysis?.issueType
          ? 0.2
          : 0;

      // Calculate location proximity if available
      let locationSimilarity = 0;
      if (
        issue.latitude &&
        issue.longitude &&
        otherIssue.latitude &&
        otherIssue.longitude
      ) {
        const distance = this.calculateDistance(
          issue.latitude,
          issue.longitude,
          otherIssue.latitude,
          otherIssue.longitude
        );
        // Within 100 meters
        if (distance < 0.1) locationSimilarity = 0.3;
        // Within 500 meters
        else if (distance < 0.5) locationSimilarity = 0.15;
      }

      const totalScore =
        keywordSimilarity * 0.4 +
        categoryMatch +
        issueTypeMatch +
        locationSimilarity;

      if (totalScore >= threshold) {
        similar.push({ issue: otherIssue, score: totalScore });
      }
    });

    return similar
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.issue);
  },

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return distance;
  },

  // Get smart search suggestions
  getSearchSuggestions(issues: Issue[], query: string, limit: number = 5): string[] {
    if (!query || query.trim().length < 2) return [];

    const suggestions = new Set<string>();

    // Extract keywords from issues
    issues.forEach((issue) => {
      // From title
      const titleWords = issue.title.toLowerCase().split(/\s+/);
      titleWords.forEach((word) => {
        if (word.includes(query.toLowerCase()) && word.length > 2) {
          suggestions.add(word);
        }
      });

      // From keywords
      issue.aiAnalysis?.keywords?.forEach((keyword) => {
        if (keyword.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(keyword.toLowerCase());
        }
      });

      // From issue type
      if (
        issue.aiAnalysis?.issueType &&
        issue.aiAnalysis.issueType.toLowerCase().includes(query.toLowerCase())
      ) {
        suggestions.add(issue.aiAnalysis.issueType.toLowerCase());
      }
    });

    return Array.from(suggestions).slice(0, limit);
  },
};
