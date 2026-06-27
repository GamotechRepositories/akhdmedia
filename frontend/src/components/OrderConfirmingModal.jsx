import FourCircleLoader from './ui/FourCircleLoader';

const OrderConfirmingModal = ({ open }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-confirming-title"
      aria-busy="true"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex justify-center">
          <FourCircleLoader />
        </div>
        <h2 id="order-confirming-title" className="mt-6 text-lg font-bold text-gray-900">
          Your order is confirming
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Please wait while we verify your payment and issue your license.
        </p>
      </div>
    </div>
  );
};

export default OrderConfirmingModal;
