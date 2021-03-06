import { Hydra } from 'alcaeus'
import { getResponseRunner, getResourceRunner, getUrlRunner } from './checkRunner'
import { E2eContext } from '../types'
import { ScenarioStep } from './steps'
import { HydraResource } from 'alcaeus/types/Resources'
import { ConstraintMock, StepSpy, StepStub } from './steps/stub'
import { IHydraResponse } from 'alcaeus/types/HydraResponse'
import { runAll } from './testHelpers'
import { IResource } from 'alcaeus/types/Resources/Resource'

jest.mock('alcaeus')

const loadResource: jest.Mock = Hydra.loadResource as any

describe('processResponse', () => {
  let context: E2eContext
  beforeEach(() => {
    loadResource.mockReset()
    context = {
      basePath: '',
      scenarios: [],
    }
  })

  describe('url runner', () => {
    it('fetches representation with alcaeus', async () => {
      // given
      const step: ScenarioStep = {
        children: [ ],
        constraints: [],
      } as any
      const runner = getUrlRunner('urn:resource:id', step)
      loadResource.mockResolvedValue({
        xhr: {
          url: 'x:y:z',
        },
      })

      // when
      await runner.call(context)

      // then
      expect(loadResource).toHaveBeenCalledWith('urn:resource:id')
    })

    it('passes default headers to request', async () => {
      // given
      const step: ScenarioStep = {
        children: [ ],
        constraints: [],
      } as any
      const runner = getUrlRunner('urn:resource:id', step)
      loadResource.mockResolvedValue({
        xhr: {
          url: 'x:y:z',
        },
      })
      const headersInit = new Headers({
        'Authorization': 'Bearer jwt',
      })
      context.headers = headersInit

      // when
      await runner.call(context)

      // then
      expect(loadResource).toHaveBeenCalledWith('urn:resource:id', headersInit)
    })

    it('fails when request fails', async () => {
      // given
      loadResource.mockRejectedValue(new Error('Failed to dereference link'))
      const runner = getUrlRunner('urn:resource:id', new StepStub('ignored'))

      // when
      const { result } = await runner.call(context)

      // then
      expect(result!.status).toBe('warning')
    })
  })

  describe('response runner', () => {
    it('fails when the parameter is undefined', async () => {
      // given
      const step: ScenarioStep = {
        children: [ ],
        constraints: [],
      } as any
      const runner = getResponseRunner(undefined as any, step)

      // when
      const { result } = await runner.call(context)

      // then
      expect(result!.status).toBe('failure')
    })

    it('fails when the parameter is a literal', async () => {
      // given
      const step: ScenarioStep = {
        children: [ ],
        constraints: [],
      } as any
      const runner = getResponseRunner('not a link somehow' as any, step)

      // when
      const { result } = await runner.call(context)

      // then
      expect(result!.status).toBe('failure')
    })

    it('dereferences a resource', async () => {
      // given
      const step: ScenarioStep = {
        children: [ ],
        constraints: [],
      } as any
      const resource = {
        id: 'foo',
      }
      loadResource.mockResolvedValue({
        xhr: {
          url: 'x:y:z',
        },
      })
      const runner = getResponseRunner(resource as IResource, step)

      // when
      await runner.call(context)

      // then
      expect(Hydra.loadResource).toHaveBeenCalledWith('foo')
    })

    it('does not perform request when passed a response object', async () => {
      // given
      const step: ScenarioStep = {
        children: [ ],
        constraints: [],
      } as any
      const response: IHydraResponse = {
        xhr: { url: 'foo' },
      } as any
      const runner = getResponseRunner(response, step)

      // when
      await runner.call(context)

      // then
      expect(Hydra.loadResource).not.toHaveBeenCalled()
    })

    it('runs steps on representation', async () => {
      // given
      const spy = new StepSpy()
      const step: ScenarioStep = {
        children: [ spy ],
        constraints: [],
      } as any
      const topLevelStep = new StepSpy()
      const response: IHydraResponse = {
        xhr: { url: 'foo' },
      } as any
      const runner = getResponseRunner(response, step)
      context.scenarios.push(topLevelStep)

      // when
      await runAll(runner, context)

      // then
      expect(spy.runner).toHaveBeenCalled()
      expect(topLevelStep.runner).toHaveBeenCalled()
    })

    it('does not run steps when constraint fails', async () => {
      // given
      const spy = new StepSpy()
      const step: ScenarioStep = {
        children: [ spy ],
        constraints: [ new ConstraintMock(false, 'Response') ],
      } as any
      const topLevelStep = new StepSpy()
      const response: IHydraResponse = {
        xhr: { url: 'foo' },
      } as any
      const runner = getResponseRunner(response, step)
      context.scenarios.push(topLevelStep)

      // when
      await runAll(runner, context)

      // then
      expect(spy.runner).not.toHaveBeenCalled()
      expect(topLevelStep.runner).not.toHaveBeenCalled()
    })
  })

  describe('resource runner', () => {
    it('runs steps on representation', async () => {
      // given
      const spy = new StepSpy()
      const step: ScenarioStep = {
        children: [ spy ],
        constraints: [],
      } as any
      const topLevelStep = new StepSpy()
      const resource: HydraResource = {} as any
      const runner = getResourceRunner(resource, step)
      context.scenarios.push(topLevelStep)

      // when
      await runAll(runner, context)

      // then
      expect(spy.runner).toHaveBeenCalled()
      expect(topLevelStep.runner).toHaveBeenCalled()
    })

    it('does not run steps when constraint fails', async () => {
      // given
      const spy = new StepSpy()
      const step: ScenarioStep = {
        children: [ spy ],
        constraints: [ new ConstraintMock(false, 'Representation') ],
      } as any
      const topLevelStep = new StepSpy()
      const resource: HydraResource = {} as any
      const runner = getResourceRunner(resource, step)
      context.scenarios.push(topLevelStep)

      // when
      await runAll(runner, context)

      // then
      expect(spy.runner).not.toHaveBeenCalled()
      expect(topLevelStep.runner).not.toHaveBeenCalled()
    })
  })
})
