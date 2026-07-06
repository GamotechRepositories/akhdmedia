import { Link } from 'react-router-dom';

const PayPalComplete = () => (
  <div className="mx-auto max-w-md px-4 py-16 text-center">
    <h1 className="text-xl font-bold text-gray-900">Payment approved</h1>
    <p className="mt-3 text-sm text-gray-600">
      You can return to the app or close this window.
    </p>
    <Link
      to="/"
      className="mt-6 inline-flex rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white"
    >
      Back to Home
    </Link>
  </div>
);

export default PayPalComplete;
