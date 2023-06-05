pub trait Updateable<T> {
    fn on_update(&self, events: T);
}
