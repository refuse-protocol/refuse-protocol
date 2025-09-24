import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      })
      return
    }

    next()
  }
}

// Custom validation helpers
export const validateUUID = (value: string, helpers: Joi.CustomHelpers): string => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(value)) {
    return helpers.error('any.invalid')
  }
  return value
}

export const validatePositiveNumber = (value: number, helpers: Joi.CustomHelpers): number => {
  if (value <= 0) {
    return helpers.error('number.positive')
  }
  return value
}
