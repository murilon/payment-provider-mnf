import {
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationRequest,
  CancellationResponse,
  Cancellations,
  InboundRequest,
  InboundResponse,
  PaymentProvider,
  RefundRequest,
  RefundResponse,
  Refunds,
  SettlementRequest,
  SettlementResponse,
  Settlements,
} from '@vtex/payment-provider'
import { VBase } from '@vtex/api'

import { randomString } from './utils'
import { executeAuthorization } from './flow'

const authorizationsBucket = 'authorizations'
const persistAuthorizationResponse = async (
  vbase: VBase,
  resp: AuthorizationResponse
) => vbase.saveJSON(authorizationsBucket, resp.paymentId, resp)

const getPersistedAuthorizationResponse = async (
  vbase: VBase,
  req: AuthorizationRequest
) =>
  vbase.getJSON<AuthorizationResponse | undefined>(
    authorizationsBucket,
    req.paymentId,
    true
  )

export default class MuriloFariaPaymentProviderFramework extends PaymentProvider {
  // This class needs modifications to pass the test suit.
  // Refer to https://help.vtex.com/en/tutorial/payment-provider-protocol#4-testing
  // in order to learn about the protocol and make the according changes.

  private async saveAndRetry(
    req: AuthorizationRequest,
    resp: AuthorizationResponse
  ) {
    //console.log(req)
    //console.log(resp)
    await persistAuthorizationResponse(this.context.clients.vbase, resp)
    this.callback(req, resp)
  }

  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    //console.log(authorization)
    //if (this.isTestSuite) {
      const persistedResponse = await getPersistedAuthorizationResponse(
        this.context.clients.vbase,
        authorization
      )

      if (persistedResponse !== undefined && persistedResponse !== null) {
        return persistedResponse
      }

      return executeAuthorization(authorization, response =>
        this.saveAndRetry(authorization, response)
      )
    //}

    //throw new Error('Not implemented')
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    //if (this.isTestSuite) {
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    //}

    //throw new Error('Not implemented')
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    //if (this.isTestSuite) {
      return Refunds.approve(refund, {
        refundId: randomString()
      })
    //}

    //throw new Error('Not implemented')
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    //if (this.isTestSuite) {
      return Settlements.approve(settlement, {
        settleId: randomString()
      })
    //}

    //throw new Error('Not implemented')
  }

  public inbound(inbound: InboundRequest): Promise<InboundResponse> {
    const response = async () => {
      return {
        paymentId: inbound.paymentId,
        code: '200',
        message: 'Inbound Request Test',
        responseData: {
          statusCode: 200,
          contentType: 'Application/JSON',
          content: JSON.stringify({
            ...JSON.parse(inbound.requestData.body),
            appKey: this.apiKey,
            appToken: this.appToken,
          }),
        },
        requestId: randomString(),
      }
    }

    return response()
  }


}
