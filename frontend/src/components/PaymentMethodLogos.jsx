const Badge = ({ label, children, className = '' }) => (
  <span
    className={`inline-flex h-7 min-w-[44px] items-center justify-center rounded-md border border-gray-200 bg-white px-2 shadow-sm ${className}`}
    title={label}
    aria-label={label}
  >
    {children}
  </span>
)

const LogoVisa = () => (
  <Badge label="Visa">
    <span className="text-[11px] font-bold italic tracking-wide text-[#1A1F71]">VISA</span>
  </Badge>
)

const LogoMastercard = () => (
  <Badge label="Mastercard">
    <svg className="h-4 w-7" viewBox="0 0 36 22" fill="none" aria-hidden>
      <circle cx="13" cy="11" r="8" fill="#EB001B" />
      <circle cx="23" cy="11" r="8" fill="#F79E1B" />
      <path d="M18 5.2a7.98 7.98 0 010 11.6 7.98 7.98 0 010-11.6z" fill="#FF5F00" />
    </svg>
  </Badge>
)

const LogoRuPay = () => (
  <Badge label="RuPay">
    <span className="text-[10px] font-bold tracking-tight text-[#097939]">RuPay</span>
  </Badge>
)

const LogoUpi = () => (
  <Badge label="UPI">
    <span className="inline-flex items-center gap-1">
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 13L6.5 2h2.2L4.2 13H2z" fill="#097939" />
        <path d="M6.8 13L11.3 2H13.5L9 13H6.8z" fill="#ED752E" />
      </svg>
      <span className="text-[10px] font-bold tracking-wide text-gray-800">UPI</span>
    </span>
  </Badge>
)

const LogoGPay = () => (
  <Badge label="Google Pay">
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold tracking-tight">
      <span className="text-[#4285F4]">G</span>
      <span className="text-gray-600">Pay</span>
    </span>
  </Badge>
)

const LogoPayPal = () => (
  <Badge label="PayPal">
    <span className="text-[10px] font-bold tracking-tight">
      <span className="text-[#003087]">Pay</span>
      <span className="text-[#009CDE]">Pal</span>
    </span>
  </Badge>
)

const LogoPaytm = () => (
  <Badge label="Paytm">
    <span className="text-[10px] font-bold tracking-tight">
      <span className="text-[#00BAF2]">Pay</span>
      <span className="text-[#002E6E]">tm</span>
    </span>
  </Badge>
)

const LogoPhonePe = () => (
  <Badge label="PhonePe">
    <span className="text-[9px] font-bold tracking-tight text-[#5F259F]">PhonePe</span>
  </Badge>
)

const PAYMENT_LOGOS = [
  LogoVisa,
  LogoMastercard,
  LogoRuPay,
  LogoUpi,
  LogoGPay,
  LogoPayPal,
  LogoPaytm,
  LogoPhonePe,
]

const PaymentMethodLogos = ({ className = '' }) => (
  <div
    className={`flex flex-wrap items-center justify-center gap-2 ${className}`}
    role="list"
    aria-label="Accepted payment methods"
  >
    {PAYMENT_LOGOS.map((Logo, index) => (
      <span key={index} role="listitem">
        <Logo />
      </span>
    ))}
  </div>
)

export default PaymentMethodLogos
