import { PaymentProviderService } from '@vtex/payment-provider'

import MuriloFariaPaymentProviderFramework from './connector'

export default new PaymentProviderService({
  connector: MuriloFariaPaymentProviderFramework,
})
