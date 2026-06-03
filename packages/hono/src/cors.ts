export const cors = () => async (_c:any,next?:()=>Promise<void>) => { if(next) await next(); };
