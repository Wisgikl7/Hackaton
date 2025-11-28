export class VisitApprovedEvent {
  constructor(
    public readonly visitaId: string,
    public readonly autorizanteId: string,
    public readonly nombreVisitante: string,
  ) {}
}
