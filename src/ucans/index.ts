
import { EdKeypair, verify, encode, build, Ucan, Capability, Fact, DidableKey, ValidateOptions, validate, parse, UcanParts } from '@ucans/ucans';
export { UcanParts } from '@ucans/ucans'

export type { Ucan, Capability, Superuser, Ability, ResourcePointer } from '@ucans/ucans';
export { SUPERUSER } from '@ucans/ucans';
export const genKeyPair = async ({ decode = true }: { decode?:boolean}):Promise<EdKeypair|string> => {
    const kp = await EdKeypair.create({ exportable: decode });
    if (kp) {
        if (decode) {
            return await kp.export();
        } else return kp;
    } else throw new Error('Error generating keypair');
};

export const encodeKeyPair = ({ secretKey }: { secretKey: string }) => {
    return EdKeypair.fromSecretKey(secretKey);
};

export const validateUcan = async (encodedUcan:string, options?:Partial<ValidateOptions>) => {
    return await validate(encodedUcan, options);
};

export type VerifyOptions = {
    audience: string,
    encodeUcan?: boolean,
    requiredCapabilities?: Array<{ capability: Capability, rootIssuer: string }>
}

export const verifyUcan = async (ucan:string, {audience, requiredCapabilities = []}:VerifyOptions) => {
    if(ucan && audience) {
        return await verify(ucan, {
            audience,
            // TODO: write isRevoked callback
            isRevoked: async (ucan:Ucan<string>) => false,
            // as a stub. Should look up the UCAN CID in a DB.
            // isRevoked: ucan => some function to determine if revoked
            requiredCapabilities: requiredCapabilities && Array.isArray(requiredCapabilities) ? requiredCapabilities : []
        })
    } else console.error(`Error verifying ucan ${ucan} for audience ${audience}`);

};

export type UcanBuildParams = {
    issuer: DidableKey;
    audience: string;
    capabilities?: Capability[];
    lifetimeInSeconds?: number;
    expiration?: number;
    notBefore?: number;
    facts?: Fact[];
    proofs?: string[];
    addNonce?: boolean;
}

export const buildUcan = async (config:UcanBuildParams):Promise<Ucan> => {
    if(!config.lifetimeInSeconds) config.lifetimeInSeconds = (60 * 60 * 24);
    return await build(config)
        .catch(err => {
            throw new Error(`error building ucan:  ${err.message}`);
        });
};

export const ucanToken = (ucan:Ucan|string):string => {
    return typeof ucan === 'string' ? ucan : encode(ucan as Ucan<unknown>);
};

export const parseUcan = (ucan:Ucan|string):UcanParts => {
    return parse(ucanToken(ucan));
}

type CapabilityGen = {
    with: { scheme:string, hierPart:string },
    can: { namespace:string, segments:string[]|string}
};

export type CapabilitySettings = {
    defaultScheme: string,
    defaultHierPart: string
}
export const genCapability = (capabilityParts: Partial<Capability>, settings: CapabilitySettings): Capability => {
    let namespace = '';
    let segments: string[] = [];
    if (typeof capabilityParts.can === 'object') {
        namespace = capabilityParts.can.namespace;
        segments = capabilityParts.can.segments;
    }
    const {scheme = '', hierPart = ''} = {
        scheme: settings.defaultScheme,
        hierPart: settings.defaultHierPart,
        ...capabilityParts.with
    };
    return {
        with: {scheme, hierPart: `${hierPart || settings.defaultHierPart}`},
        can: typeof capabilityParts.can === 'string' ? capabilityParts.can : {
            namespace,
            segments: Array.isArray(segments) ? segments : [segments]
        }
    }
}


