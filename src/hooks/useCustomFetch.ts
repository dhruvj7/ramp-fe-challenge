import { useCallback, useContext } from "react"
import { AppContext } from "../utils/context"
import { fakeFetch, RegisteredEndpoints } from "../utils/fetch"
import { useWrappedRequest } from "./useWrappedRequest"
import { Transaction } from "src/utils/types"
import { SetTransactionApprovalParams } from "src/utils/types"

export function useCustomFetch() {
  const { cache } = useContext(AppContext)
  const { loading, wrappedRequest } = useWrappedRequest()

  const fetchWithCache = useCallback(
    async <TData, TParams extends object = object>(
      endpoint: RegisteredEndpoints,
      params?: TParams
    ): Promise<TData | null> =>
      wrappedRequest<TData>(async () => {
        const cacheKey = getCacheKey(endpoint, params)
        const cacheResponse = cache?.current.get(cacheKey)

        console.log("cache -",cacheResponse);
        // debugger;

        if (cacheResponse) {
          const data = JSON.parse(cacheResponse)
          return data as Promise<TData>
        }

        const result = await fakeFetch<TData>(endpoint, params)
        cache?.current.set(cacheKey, JSON.stringify(result))
        return result
      }),
    [cache, wrappedRequest]
  )

  // const fetchWithoutCache = useCallback(
  //   async <TData, TParams extends object = object>(
  //     endpoint: RegisteredEndpoints,
  //     params?: TParams
  //   ): Promise<TData | null> =>
  //     wrappedRequest<TData>(async () => {
  //       const result = await fakeFetch<TData>(endpoint, params)
  //       console.log("result in without cache-",result)
  //       return result
  //     }),
  //   [wrappedRequest]
  // )

  const fetchWithoutCache = useCallback(
    async <TData, TParams extends object = object>(
      endpoint: RegisteredEndpoints,
      params?: TParams
    ): Promise<TData | null> =>
      wrappedRequest<TData>(async () => {
        const result = await fakeFetch<TData>(endpoint, params)

        //bug 7
        //Updating Cache
        cache?.current.forEach((value, key) => {
          if (key.split("@")[0] === "paginatedTransactions") {
            let paginatedTransactionsData: { nextPage: number; data: Transaction[] } = JSON.parse(value)
            paginatedTransactionsData.data.map((data: Transaction) => {
              if (data.id === (params as SetTransactionApprovalParams)?.transactionId) {
                data.approved = (params as SetTransactionApprovalParams).value
              }
            })
            cache.current.set(key, JSON.stringify(paginatedTransactionsData))
          }
          if (key.split("@")[0] === "transactionsByEmployee") {
            console.log(JSON.parse(value), key.split("@")[0])
            let transactionsByEmployeeData: Transaction[] = JSON.parse(value)
            transactionsByEmployeeData.map((data: Transaction) => {
              if (data.id === (params as SetTransactionApprovalParams)?.transactionId) {
                data.approved = (params as SetTransactionApprovalParams).value
              }
            })
            cache.current.set(key, JSON.stringify(transactionsByEmployeeData))
          }
        })

        return result
      }),
    [wrappedRequest]
  )

  
  const clearCache = useCallback(() => {
    if (cache?.current === undefined) {
      return
    }
    cache.current = new Map<string, string>()
  }, [cache])

  const clearCacheByEndpoint = useCallback(
    (endpointsToClear: RegisteredEndpoints[]) => {
      if (cache?.current === undefined) {
        return
      }

      const cacheKeys = Array.from(cache.current.keys())

      for (const key of cacheKeys) {
        const clearKey = endpointsToClear.some((endpoint) => key.startsWith(endpoint))

        if (clearKey) {
          cache.current.delete(key)
        }
      }
    },
    [cache]
  )

  return { fetchWithCache, fetchWithoutCache, clearCache, clearCacheByEndpoint, loading }
}

function getCacheKey(endpoint: RegisteredEndpoints, params?: object) {
  return `${endpoint}${params ? `@${JSON.stringify(params)}` : ""}`
}
