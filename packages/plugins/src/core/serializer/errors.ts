import { DevalueError } from "devalue"


export class SerializeError extends Error {
  path?: string
  constructor(cause: unknown) {
    super("Failed to serialize value")
    this.name = "SerializeError"
    this.cause = cause
    if (cause instanceof DevalueError) {
      this.path = cause.path
    }
  }
}

export class DeserializeError extends Error {
  path?: string
  constructor(cause: unknown) {
    super("Failed to deserialize value")
    this.name = "DeserializeError"
    this.cause = cause
    if (cause instanceof DevalueError) {
      this.path = cause.path
    }
  }
}