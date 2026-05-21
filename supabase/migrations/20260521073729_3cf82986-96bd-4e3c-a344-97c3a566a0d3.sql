
CREATE POLICY "Admins delete any consultation"
ON public.consultations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete any prescriptions_log"
ON public.prescriptions_log FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete any payment_request"
ON public.payment_requests FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
