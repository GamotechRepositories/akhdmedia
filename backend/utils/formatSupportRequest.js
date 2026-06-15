export const formatSupportRequest = (request) => ({
  id: request._id.toString(),
  ticketNumber: request.ticketNumber,
  name: request.name,
  email: request.email,
  phone: request.phone || '',
  orderNumber: request.orderNumber || '',
  subject: request.subject,
  message: request.message,
  status: request.status,
  adminNotes: request.adminNotes || '',
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
})
