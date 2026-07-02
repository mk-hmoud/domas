import { useEffect, useState } from "react";
import {
  countries as countriesApi,
  departments as departmentsApi,
} from "@domas/api-client";
import { Country, Department } from "@domas/ts-types";

// Module-level cache: these are static reference data that never change during a session.
let cachedCountries: Country[] | null = null;
let countriesPromise: Promise<Country[]> | null = null;

let cachedDepartments: Department[] | null = null;
let departmentsPromise: Promise<Department[]> | null = null;

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>(cachedCountries ?? []);
  const [loading, setLoading] = useState(!cachedCountries);

  useEffect(() => {
    if (cachedCountries) return;
    if (!countriesPromise) {
      countriesPromise = countriesApi.findAll();
    }
    let active = true;
    countriesPromise.then((data) => {
      cachedCountries = data;
      if (active) {
        setCountries(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { countries, loading };
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>(
    cachedDepartments ?? [],
  );
  const [loading, setLoading] = useState(!cachedDepartments);

  useEffect(() => {
    if (cachedDepartments) return;
    if (!departmentsPromise) {
      departmentsPromise = departmentsApi.findAll();
    }
    let active = true;
    departmentsPromise.then((data) => {
      cachedDepartments = data;
      if (active) {
        setDepartments(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { departments, loading };
}
