export class VisitPendingEvent {
  constructor(
    public readonly visitaId: string,
    public readonly autorizanteId: string,
    public readonly autorizanteEmail: string,
    public readonly autorizanteName: string,
    public readonly nombreVisitante: string,
    public readonly fechaHoraLlegada: Date,
    public readonly recencionistaId: string,
    public readonly recepcionistaName: string
  ) {}
}