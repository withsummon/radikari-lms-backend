-- CreateIndex
CREATE INDEX "Knowledge_tenantId_access_idx" ON "public"."Knowledge"("tenantId", "access");

-- CreateIndex
CREATE INDEX "Knowledge_createdByUserId_idx" ON "public"."Knowledge"("createdByUserId");

-- CreateIndex
CREATE INDEX "Knowledge_access_idx" ON "public"."Knowledge"("access");

-- CreateIndex
CREATE INDEX "UserKnowledge_knowledgeId_userId_idx" ON "public"."UserKnowledge"("knowledgeId", "userId");
