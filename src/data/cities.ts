import type { City } from "@/store/useStore"

export const CITIES: City[] = [
  // Asia
  { name: "Seoul", lat: 37.5665, lng: 126.9780, timezone: "Asia/Seoul", countryCode: "KR", currencyCode: "KRW" },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo", countryCode: "JP", currencyCode: "JPY" },
  { name: "Bangkok", lat: 13.7563, lng: 100.5018, timezone: "Asia/Bangkok", countryCode: "TH", currencyCode: "THB" },
  { name: "Bali", lat: -8.4095, lng: 115.1889, timezone: "Asia/Makassar", countryCode: "ID", currencyCode: "IDR" },
  { name: "Singapore", lat: 1.3521, lng: 103.8198, timezone: "Asia/Singapore", countryCode: "SG", currencyCode: "SGD" },
  { name: "Ho Chi Minh", lat: 10.8231, lng: 106.6297, timezone: "Asia/Ho_Chi_Minh", countryCode: "VN", currencyCode: "VND" },
  { name: "Kuala Lumpur", lat: 3.1390, lng: 101.6869, timezone: "Asia/Kuala_Lumpur", countryCode: "MY", currencyCode: "MYR" },
  { name: "Taipei", lat: 25.0330, lng: 121.5654, timezone: "Asia/Taipei", countryCode: "TW", currencyCode: "TWD" },
  { name: "Hong Kong", lat: 22.3193, lng: 114.1694, timezone: "Asia/Hong_Kong", countryCode: "HK", currencyCode: "HKD" },
  { name: "Beijing", lat: 39.9042, lng: 116.4074, timezone: "Asia/Shanghai", countryCode: "CN", currencyCode: "CNY" },
  { name: "Shanghai", lat: 31.2304, lng: 121.4737, timezone: "Asia/Shanghai", countryCode: "CN", currencyCode: "CNY" },
  { name: "Moscow", lat: 55.7558, lng: 37.6173, timezone: "Europe/Moscow", countryCode: "RU", currencyCode: "RUB" },

  // Europe
  { name: "London", lat: 51.5074, lng: -0.1278, timezone: "Europe/London", countryCode: "GB", currencyCode: "GBP" },
  { name: "Paris", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris", countryCode: "FR", currencyCode: "EUR" },
  { name: "Lisbon", lat: 38.7223, lng: -9.1393, timezone: "Europe/Lisbon", countryCode: "PT", currencyCode: "EUR" },
  { name: "Barcelona", lat: 41.3851, lng: 2.1734, timezone: "Europe/Madrid", countryCode: "ES", currencyCode: "EUR" },
  { name: "Berlin", lat: 52.5200, lng: 13.4050, timezone: "Europe/Berlin", countryCode: "DE", currencyCode: "EUR" },
  { name: "Amsterdam", lat: 52.3676, lng: 4.9041, timezone: "Europe/Amsterdam", countryCode: "NL", currencyCode: "EUR" },
  { name: "Prague", lat: 50.0755, lng: 14.4378, timezone: "Europe/Prague", countryCode: "CZ", currencyCode: "CZK" },

  // Americas
  { name: "New York", lat: 40.7128, lng: -74.0060, timezone: "America/New_York", countryCode: "US", currencyCode: "USD" },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, timezone: "America/Los_Angeles", countryCode: "US", currencyCode: "USD" },
  { name: "Miami", lat: 25.7617, lng: -80.1918, timezone: "America/New_York", countryCode: "US", currencyCode: "USD" },
  { name: "Mexico City", lat: 19.4326, lng: -99.1332, timezone: "America/Mexico_City", countryCode: "MX", currencyCode: "MXN" },
  { name: "Buenos Aires", lat: -34.6037, lng: -58.3816, timezone: "America/Argentina/Buenos_Aires", countryCode: "AR", currencyCode: "ARS" },
  { name: "Toronto", lat: 43.6532, lng: -79.3832, timezone: "America/Toronto", countryCode: "CA", currencyCode: "CAD" },

  // Middle East & Africa
  { name: "Dubai", lat: 25.2048, lng: 55.2708, timezone: "Asia/Dubai", countryCode: "AE", currencyCode: "AED" },
  { name: "Cape Town", lat: -33.9249, lng: 18.4241, timezone: "Africa/Johannesburg", countryCode: "ZA", currencyCode: "ZAR" },

  // Oceania
  { name: "Sydney", lat: -33.8688, lng: 151.2093, timezone: "Australia/Sydney", countryCode: "AU", currencyCode: "AUD" },
  { name: "Melbourne", lat: -37.8136, lng: 144.9631, timezone: "Australia/Melbourne", countryCode: "AU", currencyCode: "AUD" },
]
