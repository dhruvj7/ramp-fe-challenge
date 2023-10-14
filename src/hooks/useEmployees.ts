import { useCallback, useState } from "react"
import { Employee } from "../utils/types"
import { useCustomFetch } from "./useCustomFetch"
import { EmployeeResult } from "./types"

export function useEmployees(): EmployeeResult {
  const { fetchWithoutCache, loading } = useCustomFetch()
  const [employees, setEmployees] = useState<Employee[] | null>(null)

  const fetchAll = useCallback(async () => {
    const employeesData = await fetchWithoutCache<Employee[]>("employees")
    setEmployees(employeesData)
  }, [fetchWithoutCache])

  const invalidateData = useCallback(() => {
    setEmployees(null)
  }, [])

  return { data: employees, loading, fetchAll, invalidateData }
}
