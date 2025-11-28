export class VisitRejectedEvent {
  constructor(
    public readonly visitaId: string,
    public readonly autorizanteId: string,
    public readonly autorizanteName: string,
    public readonly autorizanteEmail: string,
    public readonly nombreVisitante: string,
    public readonly razon: string,
    public readonly recepcionistaId: string | null,
  ) {}
}
