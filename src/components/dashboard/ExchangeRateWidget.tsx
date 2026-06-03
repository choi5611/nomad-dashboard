import { useState, useEffect } from "react"
import { GlassCard, CardHeader, CardTitle, CardContent } from "@/components/dashboard/GlassCard"
import { DollarSign, Loader2, TrendingUp, AlertCircle } from "lucide-react"
import axios from "axios"
import AnimatedNumber from "@/components/ui/AnimatedNumber"

interface ExchangeRateWidgetProps {
  targetCurrency: string
}

const SUPPORTED_CURRENCIES = [
  "AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP",
  "HKD", "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR",
  "NOK", "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR"
]

export default function ExchangeRateWidget({ targetCurrency }: ExchangeRateWidgetProps) {
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const baseCurrency = "USD"

  useEffect(() => {
    if (targetCurrency === baseCurrency) {
      setRate(1)
      setUnsupported(false)
      return
    }

    // 지원하지 않는 통화 체크
    if (!SUPPORTED_CURRENCIES.includes(targetCurrency)) {
      setRate(null)
      setUnsupported(true)
      setLoading(false)
      return
    }

    async function fetchRate() {
      setLoading(true)
      setUnsupported(false)
      try {
        const response = await axios.get(
          `https://api.frankfurter.dev/v1/latest?from=${baseCurrency}&to=${targetCurrency}`
        )
        setRate(response.data.rates[targetCurrency])
      } catch (error) {
        console.error("Failed to fetch exchange rate", error)
        setRate(null)
      } finally {
        setLoading(false)
      }
    }

    fetchRate()
  }, [targetCurrency])

  return (
    <GlassCard className="w-64 transition-all hover:bg-white/5">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium text-blue-200 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> <span>Exchange Rate</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {loading ? (
             <div className="flex items-center gap-2 text-white/50">
               <Loader2 className="w-4 h-4 animate-spin" /> <span>Loading...</span>
             </div>
        ) : unsupported ? (
          <div>
            <div className="text-lg font-bold text-white/50">
               <span>{targetCurrency}</span>
            </div>
            <div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> <span>Not Available</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-lg font-bold">
               <span>1 {baseCurrency} = </span>
               <AnimatedNumber value={rate || 0} precision={2} suffix={` ${targetCurrency}`} />
            </div>
            {rate && targetCurrency !== "USD" && (
                <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> <span>Live Rate</span>
                </div>
            )}
            {targetCurrency === "USD" && (
                 <div className="text-xs text-white/50 mt-1"><span>Base Currency</span></div>
            )}
          </div>
        )}
      </CardContent>
    </GlassCard>
  )
}
