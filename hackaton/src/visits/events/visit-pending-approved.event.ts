export class VisitPendingApprovedEvent {
  constructor(
    public readonly visitaId: string,
    public readonly recepcionistaId: string,
    public readonly nombreVisitante: string,
    public readonly autorizanteName: string,
  ) {}
}
