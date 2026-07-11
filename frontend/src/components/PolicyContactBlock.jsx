import { Link } from 'react-router-dom'
import { BRAND } from '../config/brand'

const PolicyContactBlock = () => (
  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
    <p className="font-semibold text-gray-900">{BRAND.name}</p>
    <p className="mt-2 leading-relaxed">{BRAND.companyAddress}</p>
    <p className="mt-3">
      Website:{' '}
      <a href={`https://www.${BRAND.domain}`} className="font-medium text-gray-900 underline">
        https://www.{BRAND.domain}
      </a>
    </p>
    <p>
      Email:{' '}
      <a href={`mailto:${BRAND.supportEmail}`} className="font-medium text-gray-900 underline">
        {BRAND.supportEmail}
      </a>
    </p>
    <p className="mt-3">
      <Link to="/support" className="font-medium text-gray-900 underline">
        Contact Support
      </Link>
    </p>
  </div>
)

export default PolicyContactBlock
