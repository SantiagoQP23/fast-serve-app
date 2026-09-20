import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUsersSuggestions } from "@/core/users/actions/user-actions";

export const useUsersSuggestions = (debounceMs = 500) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), debounceMs);
    return () => clearTimeout(timeout);
  }, [search, debounceMs]);

  const usersQuery = useQuery({
    queryKey: ["users", "suggestions", debouncedSearch],
    queryFn: () => getUsersSuggestions(debouncedSearch),
    enabled: !!debouncedSearch,
  });

  return {
    search,
    handleChangeSearch: setSearch,
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isFetching,
  };
};
