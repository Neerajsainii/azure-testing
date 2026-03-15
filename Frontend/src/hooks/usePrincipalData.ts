import { useEffect, useMemo, useRef, useState } from "react"
import { principalAPI } from "@/lib/api"
type Graph = { nodes: Record<string, any>; edges: [string, string, string][] }
export function usePrincipalData(depth: number = 2) {
  const [data, setData] = useState<Graph | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const keyRef = useRef<string>("")
  const fetchData = async (d: number) => {
    try {
      setLoading(true)
      setError(null)
      keyRef.current = `depth:${d}`
      const res = await principalAPI.getPrincipalDataGraph(d)
      if (keyRef.current !== `depth:${d}`) return
      setData(res.data as Graph)
    } catch (e: any) {
      setError(e?.message || "Failed to fetch principal data")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchData(depth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depth])
  const departments = useMemo(() => {
    if (!data) return []
    const list = Object.values(data.nodes).filter((n: any) => n.type === "department")
    return list
  }, [data])
  return { data, departments, loading, error, refresh: () => fetchData(depth) }
}
