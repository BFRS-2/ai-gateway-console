export default class API_Error {
    error: string | object
    constructor(err: string | object) {
        this.error = err
    }

    throwError() {
        return {
            status: false,
            error: {
                type: 'api_err',
                message: this.error
            }
        }
    }
}