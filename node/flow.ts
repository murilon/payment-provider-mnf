import {
  isBankInvoiceAuthorization,
  //isCardAuthorization,
  //isTokenizedCard,
  AuthorizationRequest,
  AuthorizationResponse,
  Authorizations,
} from '@vtex/payment-provider'

import { randomString, randomUrl } from './utils'

type Flow =
  | 'Authorize'
  | 'PaymentApp'
  | 'Denied'
  | 'Cancel'
  | 'AsyncApproved'
  | 'AsyncDenied'
  | 'BankInvoice'
  | 'Redirect'

export const flows: Record<
  Flow,
  (
    authorization: AuthorizationRequest,
    retry: (response: AuthorizationResponse) => void
  ) => AuthorizationResponse
> = {
  Authorize: request =>
    Authorizations.approve(request, {
      authorizationId: randomString(),
      nsu: randomString(),
      tid: randomString(),
      
    }),
  
  Denied: request => Authorizations.deny(request, { tid: randomString() }),

  Cancel: (request, retry) => flows.Authorize(request, retry),

  AsyncApproved: (request, retry) => {
    retry(
      Authorizations.approve(request, {
        authorizationId: randomString(),
        nsu: randomString(),
        tid: randomString(),
      })
    )
    console.log("Async Approved") 

    return Authorizations.pending(request, {
      delayToCancel: 1000,
      tid: randomString(),
    })
  },

  AsyncDenied: (request, retry) => {
    retry(Authorizations.deny(request, { tid: randomString() }))
    console.log("Async Denied") 

    return Authorizations.pending(request, {
      delayToCancel: 1000,
      tid: randomString(),
    })
  },

  BankInvoice: (request, retry) => {
    retry(
      Authorizations.approve(request, {
        authorizationId: randomString(),
        nsu: randomString(),
        tid: randomString(),
      })
    )
    console.log("BankInvoice") 

    return Authorizations.pendingBankInvoice(request, {
      delayToCancel: 1000,
      paymentUrl: randomUrl(),
      tid: randomString(),
    })
  },

  PaymentApp: (request) => {
    const {paymentId} = request;
    console.log("PaymentApp") 
    return {
      status: 'undefined',
      authorizationId: randomString(),
      paymentAppData: {
        appName: 'murilofaria.payment-auth-app-mnf',
        payload: JSON.stringify({ paymentId })
    },
      tid: randomString(),
      acquirer: null,
      delayToCancel: 1000,
      delayToAutoSettle: 1000,
      paymentId,
      code: "200",
      message: "Complete trought PaymentApp Flow",
    }
  },
  

  Redirect: (request, retry) => {
    retry(
      Authorizations.approve(request, {
        authorizationId: randomString(),
        nsu: randomString(),
        tid: randomString(),
      })
    )
    console.log("Redirect")  
    return Authorizations.redirect(request, {
      delayToCancel: 1000,
      redirectUrl: "https://www.lipsum.com/",
      tid: randomString(),
    })
  },
}

export type CardNumber =
  | '4444333322221111'
  | '4444333322221112'
  | '4444333322221113'
  | '4222222222222224'
  | '4222222222222225'
  | 'null'

/*const cardResponses: Record<CardNumber, Flow> = {
  '4444333322221111': 'Authorize',
  '4444333322221112': 'Redirect',
  '4444333322221113': 'PaymentApp',
  '4222222222222224': 'AsyncApproved',
  '4222222222222225': 'AsyncDenied',
  null: 'Denied',
}*/

const findFlow = (request: any): Flow => {
  console.log('Entrei no flow')
  console.log(request.paymentMethod)
  if (isBankInvoiceAuthorization(request)) {
    console.log('Entrei no BankInvoice')
    return 'BankInvoice'
  }

/*
  if (isCardAuthorization(request)) {
    const { card } = request
    const cardNumber = isTokenizedCard(card) ? '4444333322221113' : card.number
    console.log('Entrei no CC')
    return cardResponses[cardNumber as CardNumber]
  }
*/
  if(request.paymentMethod = 'Murilo Payment'){
    console.log('Entrei no PaymentApp')
    return 'PaymentApp'
  }
    

  
  console.log('Entrei no Denied')
  return 'Denied'
  
}


export const executeAuthorization = (
  request: AuthorizationRequest,
  retry: (response: AuthorizationResponse) => void
): AuthorizationResponse => {
  const flow = findFlow(request)

  return flows[flow](request, retry)
}
