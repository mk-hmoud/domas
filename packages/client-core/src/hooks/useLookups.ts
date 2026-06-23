import { useEffect, useState } from "react";
import {
  countries as countriesApi,
  departments as departmentsApi,
} from "@domas/api-client";
import { Country, Department } from "@domas/ts-types";

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    countriesApi
      .findAll()
      .then((data) => {
        if (active) setCountries(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { countries, loading };
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    departmentsApi
      .findAll()
      .then((data) => {
        if (active) setDepartments(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { departments, loading };
}
