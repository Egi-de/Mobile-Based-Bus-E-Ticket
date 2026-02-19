import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';
import { sendSuccess, sendError } from '../utils/response';
import { BookingStatus } from '@prisma/client';

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { routeId, seats, totalAmount, travelDate } = req.body;
    const userId = (req as any).user.userId; // From auth middleware

    if (!routeId || !seats || !totalAmount || !travelDate) {
      return sendError(res, 'Missing required fields', 400);
    }

    const booking = await BookingService.createBooking({
      userId,
      routeId,
      seats,
      totalAmount,
      travelDate: new Date(travelDate),
    });

    return sendSuccess(res, booking, 'Booking created successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { status } = req.query;

    const bookings = await BookingService.getUserBookings(
      userId,
      status as BookingStatus
    );

    return sendSuccess(res, bookings, 'Bookings fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const bookings = await BookingService.getAllBookings(
      status as BookingStatus
    );

    return sendSuccess(res, bookings, 'All bookings fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bookingId = Array.isArray(id) ? id[0] : id;
    const booking = await BookingService.getBookingById(bookingId);

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    return sendSuccess(res, booking, 'Booking fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bookingId = Array.isArray(id) ? id[0] : id;
    const booking = await BookingService.cancelBooking(bookingId);

    return sendSuccess(res, booking, 'Booking cancelled successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bookingId = Array.isArray(id) ? id[0] : id;
    const { status } = req.body;

    if (!status) {
      return sendError(res, 'Status is required', 400);
    }

    const booking = await BookingService.updateBookingStatus(bookingId, status as BookingStatus);

    return sendSuccess(res, booking, 'Booking status updated successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getBookedSeats = async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    const { date } = req.query;

    if (!date) {
      return sendError(res, 'Travel date is required', 400);
    }
    
    // Ensure routeId is a string
    const id = Array.isArray(routeId) ? routeId[0] : routeId;

    const travelDate = new Date(date as string);
    const bookedSeats = await BookingService.getBookedSeats(id, travelDate);

    return sendSuccess(res, bookedSeats, 'Booked seats fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bookingId = Array.isArray(id) ? id[0] : id;
    await BookingService.deleteBooking(bookingId);
    return sendSuccess(res, null, 'Booking deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
