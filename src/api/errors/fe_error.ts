export default class FE_Error {
    error: string | object
    constructor(err: string | object) {
        this.error = err
    }

    throwError() {
        return {
            status: false,
            error: {
                type: 'fe_err',
                message: this.error
            }
        }
    }
}