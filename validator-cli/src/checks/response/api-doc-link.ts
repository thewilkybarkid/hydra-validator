import {checkChain, Result} from '../../check'
// @ts-ignore
import * as parse from 'parse-link-header'
import {Hydra} from '../../namespace'
import urlResolveCheck from '../url-resolvable'

export default function (response: Response & any): checkChain {
    return async function apiDocLink() {
        if (!response.headers.has('link')) {
            return {
                message: Result.Failure('Link header missing')
            }
        }

        const linkHeaders = response.headers.get('link')
        const links = parse(linkHeaders)

        if (!links[Hydra.apiDocumentation.value]) {
            return {
                message: Result.Failure(`rel=<${Hydra.apiDocumentation.value}> link not found in the response`)
            }
        }

        const linkUrl = links[Hydra.apiDocumentation.value].url
        const apiDocUrl = new URL(linkUrl, response.url).toString()
        const responseUrl = new URL(response.url).toString()

        if (responseUrl !== apiDocUrl) {
            let messages = [ Result.Success('Api Documentation link found') ]
            if (apiDocUrl !== linkUrl) {
                messages.push(Result.Warning('Relative Api Documentation link may not be supported by clients'))
            }

            return {
                messages,
                nextChecks: [urlResolveCheck(apiDocUrl)]
            }
        }

        return {
            message: Result.Informational('Resource is Api Documentation'),
        }
    }
}
