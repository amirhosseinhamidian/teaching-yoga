CREATE UNIQUE INDEX "uniq_active_shopcart_per_user"
ON "ShopCart" ("userId")
WHERE "isActive" = true;