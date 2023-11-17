import { Bytes, BigInt } from "@graphprotocol/graph-ts"
import { OfferApproved, OfferCreated, OfferRevoked, OffersTraded, OwnershipTransferred as OwnershipTransferredEvent } from "../generated/Contract/Contract"
import { OwnershipTransferred, Offer, Nft, Pouch, User} from "../generated/schema"

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOfferCancelled(event: OfferCreated): void {
  const offer = Offer.load(event.params.name.toString())
  if (offer == null) {
    throw new Error("Offer not found")
  }
  offer.void = true
  offer.save()
}

export function handleOfferApproved(event: OfferApproved): void {
  const offer = Offer.load(event.params.name1)
  if (offer == null) {
    throw new Error("Offer not found")
  }
  let approvedOffers = offer.approvedOffers
  approvedOffers.push(event.params.name2)
  offer.approvedOffers = approvedOffers
  offer.save()
}

export function handleOfferRevoked(event: OfferRevoked): void {
  const offer = Offer.load(event.params.name1)
  if (offer == null) {
    throw new Error("Offer not found")
  }
  let approvedOffers = offer.approvedOffers
  let approvedOffersNew: string[] = []
  for(let i = 0; i < approvedOffers.length; i++) {
    if (approvedOffers[i] != event.params.name2) {
      approvedOffersNew.push(approvedOffers[i])
    }
  }
  offer.approvedOffers = approvedOffersNew
  offer.save()
}

export function handleOffersTraded(event: OffersTraded): void {
  const offer = Offer.load(event.params.name1)
  if (offer == null) {
    throw new Error("Offer not found")
  }
  offer.tradedWith = event.params.name2
  offer.save()
}

export function handleOfferCreated(event: OfferCreated): void {
  const offer = new Offer(event.params.name.toString())
  offer.creator = getUser(event.params.offer.maker).id
  offer.approvedOffers = []
  offer.void = event.params.offer.void
  offer.save()
  
  let nonce = -1

  for(let i = 0; i < event.params.offer.sack.nfts.length; i++) {
    nonce ++

    const nft = event.params.offer.sack.nfts[i]
    const id = event.params.name + nonce.toString()
    const nftEntity = new Nft(id)
    nftEntity.imp = nft.imp
    nftEntity.tokenId = nft.tokenId
    nftEntity.presentIn = offer.id
    nftEntity.save()
  }
  for(let i = 0; i < event.params.offer.sack.pouches.length; i++) {
    nonce ++

    const pouch = event.params.offer.sack.pouches[i]
    const id = event.params.name + nonce.toString()
    const pouchEntity = new Pouch(id)
    pouchEntity.imp = pouch.imp
    pouchEntity.value = pouch.value
    pouchEntity.presentIn = offer.id
    pouchEntity.save()
  }

}

function getUser(addr: Bytes): User {
  let user = User.load(addr)
  if (user == null) {
    user = new User(addr)
    user.save()
  }
  return user
}
