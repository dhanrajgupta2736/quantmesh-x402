# QuantMesh x402 — Algorand Smart Contract for Signal Attestation (Box Storage)
# ARC-4 Compliant PyTeal Contract for Immutable Market Signal Verification

from pyteal import *

def approval_program():
    # Handle Application Creation
    on_creation = Seq(
        App.globalPut(Bytes("creator"), Txn.sender()),
        App.globalPut(Bytes("total_attestations"), Int(0)),
        Approve()
    )

    # ABI Method: attest_signal(token: string, score: uint64, tx_id: string) -> string (box_hash)
    # Box Key: Txn.sender() + token
    # Box Value: score (8 bytes) + timestamp (8 bytes) + tx_id
    token = Txn.application_args[1]
    score = Btoi(Txn.application_args[2])
    payment_tx_id = Txn.application_args[3]

    box_key = Concat(token, Bytes("_"), payment_tx_id)
    box_value = Concat(
        Itob(score),
        Itob(Global.latest_timestamp()),
        payment_tx_id
    )

    on_attest = Seq(
        # Create box storage entry for signal verification
        Pop(BoxCreate(box_key, Int(64))),
        BoxWrite(box_key, Int(0), box_value),
        # Increment total attestations counter
        App.globalPut(
            Bytes("total_attestations"),
            App.globalGet(Bytes("total_attestations")) + Int(1)
        ),
        Approve()
    )

    router = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.NoOp, on_attest],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == App.globalGet(Bytes("creator")))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Txn.sender() == App.globalGet(Bytes("creator")))],
    )

    return router


def clear_program():
    return Approve()


if __name__ == "__main__":
    with open("contracts/approval.teal", "w") as f:
        f.write(compileTeal(approval_program(), mode=Mode.Application, version=8))

    with open("contracts/clear.teal", "w") as f:
        f.write(compileTeal(clear_program(), mode=Mode.Application, version=8))
    print("[QuantMesh] Smart Contract TEAL compiled successfully!")
