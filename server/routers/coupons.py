from fastapi import APIRouter, Depends, HTTPException
from routers.auth import get_current_user_id
from services import coupons as coupon_service

router = APIRouter(prefix="/coupons", tags=["coupons"])


@router.get("")
def list_products(user_id: int = Depends(get_current_user_id)):
    return coupon_service.list_products(user_id)


@router.post("/{product_id}/claim")
def claim_product(product_id: int, user_id: int = Depends(get_current_user_id)):
    try:
        return coupon_service.claim(user_id, product_id)
    except coupon_service.NotEligibleError:
        raise HTTPException(
            status_code=400,
            detail=f"스탬프 {coupon_service.COUPON_MILESTONE}곳 이상 모아야 상품을 받을 수 있어요.",
        )
    except coupon_service.SoldOutError:
        raise HTTPException(status_code=410, detail="해당 상품이 모두 소진됐어요.")
