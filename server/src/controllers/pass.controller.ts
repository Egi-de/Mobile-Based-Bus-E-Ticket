import { Request, Response } from 'express';
import { PassService } from '../services/pass.service';
import { sendSuccess, sendError } from '../utils/response';

export const getPassTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await PassService.getTemplates();
    return sendSuccess(res, templates, 'Pass templates fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const createPass = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { templateId } = req.body;

    if (!templateId) {
      return sendError(res, 'Template ID is required', 400);
    }

    const pass = await PassService.createPass({ userId, templateId });
    return sendSuccess(res, pass, 'Pass purchased successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getMyPasses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { status } = req.query;
    console.log(`[PassController] Fetching passes for user: ${userId}, status: ${status}`);

    const passes = await PassService.getUserPasses(userId, status as any);
    return sendSuccess(res, passes, 'User passes fetched successfully');
  } catch (error: any) {
    console.error('[PassController] Error in getMyPasses:', error);
    return sendError(res, error.message, 500);
  }
};

export const getAllPasses = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    console.log(`[PassController] Fetching all passes, status: ${status}`);

    const passes = await PassService.getAllPasses(status as any);
    return sendSuccess(res, passes, 'All passes fetched successfully');
  } catch (error: any) {
    console.error('[PassController] Error in getAllPasses:', error);
    return sendError(res, error.message, 500);
  }
};

export const deletePass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const passId = Array.isArray(id) ? id[0] : id;
    await PassService.deletePass(passId);
    return sendSuccess(res, null, 'Pass deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const updatePassStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const passId = Array.isArray(id) ? id[0] : id;
    const { status } = req.body;
    if (!status) {
      return sendError(res, 'Status is required', 400);
    }
    const pass = await PassService.updatePassStatus(passId, status);
    return sendSuccess(res, pass, 'Pass status updated successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
