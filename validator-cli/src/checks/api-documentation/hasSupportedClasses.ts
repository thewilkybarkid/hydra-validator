import { Hydra } from '../../namespace'
import { checkChain, Result } from '../../check'

export default function (apiDoc: any): checkChain {
    return function supportedClasses () {
        const classes = apiDoc.out(Hydra.supportedClass)

        if (classes.values.length === 0) {
            return {
                result: Result.Warning('No SupportedClasses found'),
            }
        }

        return {
            result: Result.Success(`Found ${classes.values.length} Supported Classes`),
        }
    }
}
