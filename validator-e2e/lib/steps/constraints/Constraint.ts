import { HydraResource } from 'alcaeus/types/Resources'
import { IHydraResponse } from 'alcaeus/types/HydraResponse'

export type ConstraintOperator = 'eq' | 'gt' | 'ge' | 'lt' | 'le' | 'regex' | 'function'
export type ConstraintType = 'Representation' | 'Response' | null

export abstract class Constraint<T = unknown> {
  private readonly __predicate: (actual: unknown) => boolean
  private readonly __negated: boolean

  public abstract get type(): ConstraintType

  public constructor(predicate: (actual: unknown) => boolean, negated: boolean) {
    this.__predicate = predicate
    this.__negated = negated
  }

  public satisfiedBy(subject: T): boolean {
    const value = this.getValue(subject)
    if (!this.sanityCheckValue(value)) {
      return false
    }

    const result = this.__predicate(value)
    const expected = !this.__negated

    return result === expected
  }

  protected abstract getValue(subject: T): unknown | null
  protected abstract sanityCheckValue(value: unknown): boolean
}

export abstract class ResponseConstraint extends Constraint<IHydraResponse> {
  public get type(): ConstraintType {
    return 'Response'
  }
}

export abstract class RepresentationConstraint extends Constraint<HydraResource> {
  public get type(): ConstraintType {
    return 'Representation'
  }
}
